from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form
from sqlalchemy.orm import Session

from app.api.v1.schemas.employee_schemas import (
    EmployeeResponse, EmployeeUpdateRequest, AdminEmployeeUpdateRequest, DocumentResponse
)
from app.application.employee_service import EmployeeService
from app.core.dependencies import get_current_user, require_role
from app.core.exceptions import NotFoundError, PermissionDeniedError
from app.domain.enums import Role
from app.infrastructure.db.session import get_db
from app.infrastructure.db import models as m
from app.infrastructure.storage.file_storage import save_file

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("/me", response_model=EmployeeResponse)
def get_my_profile(
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    try:
        return svc.get_my_profile(current_user.id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/me", response_model=EmployeeResponse)
def update_my_profile(
    payload: EmployeeUpdateRequest,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    emp = svc.get_my_profile(current_user.id)
    updates = payload.model_dump(exclude_none=True)
    try:
        return svc.update_profile(emp.id, updates, current_user)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    try:
        return svc.list_all(current_user, department, search)
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/departments", response_model=List[str])
def list_departments(
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    return svc.list_departments()


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    try:
        return svc.get_by_id(employee_id, current_user)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.patch("/{employee_id}", response_model=EmployeeResponse)
def admin_update_employee(
    employee_id: int,
    payload: AdminEmployeeUpdateRequest,
    current_user: m.UserModel = Depends(require_role(Role.ADMIN)),
    db: Session = Depends(get_db),
):
    svc = EmployeeService(db)
    updates = payload.model_dump(exclude_none=True)
    try:
        return svc.update_profile(employee_id, updates, current_user)
    except (NotFoundError, PermissionDeniedError) as e:
        raise HTTPException(status_code=404 if isinstance(e, NotFoundError) else 403, detail=str(e))


@router.post("/{employee_id}/documents", response_model=DocumentResponse)
async def upload_document(
    employee_id: int,
    doc_type: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check ownership or admin
    if current_user.role != Role.ADMIN:
        emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == current_user.id).first()
        if not emp or emp.id != employee_id:
            raise HTTPException(status_code=403, detail="Cannot upload documents for another employee.")

    try:
        # Validate 5MB limit and allowed types
        file_url = await save_file(
            file,
            subfolder="documents",
            allowed_types={"application/pdf", "image/jpeg", "image/png"},
            max_size=5 * 1024 * 1024,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    doc = m.DocumentModel(employee_id=employee_id, file_url=file_url, doc_type=doc_type)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{employee_id}/documents", response_model=List[DocumentResponse])
def get_documents(
    employee_id: int,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check ownership or admin
    if current_user.role != Role.ADMIN:
        emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == current_user.id).first()
        if not emp or emp.id != employee_id:
            raise HTTPException(status_code=403, detail="Cannot access documents of another employee.")

    docs = db.query(m.DocumentModel).filter(m.DocumentModel.employee_id == employee_id).all()
    return docs


@router.delete("/{employee_id}/documents/{doc_id}")
def delete_document(
    employee_id: int,
    doc_id: int,
    current_user: m.UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(m.DocumentModel).filter(
        m.DocumentModel.id == doc_id,
        m.DocumentModel.employee_id == employee_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Check permission: Admin only, or owner within 24 hours of upload
    if current_user.role != Role.ADMIN:
        emp = db.query(m.EmployeeModel).filter(m.EmployeeModel.user_id == current_user.id).first()
        if not emp or emp.id != employee_id:
            raise HTTPException(status_code=403, detail="Cannot delete another employee's documents.")
        
        # Check 24 hour limit (compare uploaded_at with current UTC time)
        from datetime import datetime, timezone, timedelta
        doc_time = doc.uploaded_at
        if doc_time:
            if doc_time.tzinfo is not None:
                now = datetime.now(timezone.utc)
            else:
                now = datetime.utcnow()
            if now - doc_time > timedelta(hours=24):
                raise HTTPException(
                    status_code=403,
                    detail="Employees can only delete documents within 24 hours of upload."
                )

    # Perform physical deletion
    from app.infrastructure.storage.file_storage import delete_file
    try:
        delete_file(doc.file_url)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully."}

