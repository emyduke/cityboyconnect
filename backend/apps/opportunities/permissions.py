from rest_framework.permissions import BasePermission
from apps.accounts.models import ROLE_HIERARCHY


class IsVerifiedMember(BasePermission):
    """Only verified members (voter card approved) can create profiles and listings."""
    message = "You must complete voter card verification to access this feature."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        profile = getattr(request.user, 'profile', None)
        return profile is not None and profile.voter_verification_status == 'VERIFIED'


class IsCoordinatorOrAbove(BasePermission):
    """Ward Coordinator and above."""
    message = "Coordinator access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY.get('WARD_COORDINATOR', 2)
