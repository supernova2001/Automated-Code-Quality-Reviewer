"""Add label column to code_analyses

Revision ID: auto_add_label_column
Revises: 84bc3b14104a
Create Date: 2025-05-29 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'auto_add_label_column'
down_revision = '84bc3b14104a'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('code_analyses', sa.Column('label', sa.Integer(), nullable=True))

def downgrade():
    op.drop_column('code_analyses', 'label') 