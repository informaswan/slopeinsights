"""add category to webcams

Revision ID: f7c3a9d0e1b2
Revises: d4a1f6b2c8e3
Create Date: 2026-09-23 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f7c3a9d0e1b2'
down_revision: Union[str, None] = 'd4a1f6b2c8e3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _inspector():
    return sa.inspect(op.get_bind())


def _has_table(name: str) -> bool:
    return _inspector().has_table(name)


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in _inspector().get_columns(table))


def upgrade() -> None:
    if _has_column('webcams', 'category'):
        return
    op.add_column(
        'webcams',
        sa.Column('category', sa.String(), nullable=False, server_default='mountain'),
    )


def downgrade() -> None:
    op.drop_column('webcams', 'category')
