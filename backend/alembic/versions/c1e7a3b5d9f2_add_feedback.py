"""add feedback

Revision ID: c1e7a3b5d9f2
Revises: b9d4e1f3a2c6
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1e7a3b5d9f2'
down_revision: Union[str, None] = 'b9d4e1f3a2c6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('feedback',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('email', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('feedback')
