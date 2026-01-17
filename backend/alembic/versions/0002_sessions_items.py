"""add session status and session items

Revision ID: 0002_sessions_items
Revises: 0001_initial
Create Date: 2026-01-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0002_sessions_items"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column("status", sa.String(length=32), server_default="planned", nullable=False),
    )

    op.create_table(
        "session_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "session_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
        sa.Column("planned_weight", sa.Numeric(10, 2), nullable=True),
        sa.Column("planned_reps", sa.Integer(), nullable=True),
        sa.Column("planned_sets", sa.Integer(), nullable=True),
        sa.Column("actual_weight", sa.Numeric(10, 2), nullable=True),
        sa.Column("actual_reps", sa.Integer(), nullable=True),
        sa.Column("actual_sets", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metrics", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
    )

    op.create_index("ix_session_items_session_id", "session_items", ["session_id"])


def downgrade() -> None:
    op.drop_index("ix_session_items_session_id", table_name="session_items")
    op.drop_table("session_items")
    op.drop_column("sessions", "status")
