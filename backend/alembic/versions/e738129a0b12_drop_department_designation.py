"""drop department and designation from employees

Revision ID: e738129a0b12
Revises: d9716befdf05
Create Date: 2026-08-22 13:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e738129a0b12'
down_revision = 'd9716befdf05'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column('employees', 'department')
    op.drop_column('employees', 'designation')


def downgrade():
    op.add_column('employees', sa.Column('department', sa.String(length=100), nullable=True))
    op.add_column('employees', sa.Column('designation', sa.String(length=100), nullable=True))
