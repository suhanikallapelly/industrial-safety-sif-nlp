"""
Seed data module: Hardcoded mock seed records eliminated.
The platform operates exclusively on authentic user inputs, API calls, and genuine CSV uploads.
"""

from typing import List
from models import IncidentReport


def get_seed_incidents() -> List[IncidentReport]:
    """Return empty list - dummy seed records removed."""
    return []
