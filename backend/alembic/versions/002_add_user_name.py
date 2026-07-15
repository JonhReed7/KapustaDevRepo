"""add user name column

Revision ID: 002
Revises: 001
Create Date: 2025-07-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "name")
