from rest_framework.permissions import BasePermission
from apps.accounts.models import ROLE_HIERARCHY


class IsSuperAdmin(BasePermission):
    message = "Super Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'SUPER_ADMIN'
        )


class IsNationalOfficerOrAbove(BasePermission):
    message = "National Officer access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY.get('NATIONAL_OFFICER', 8)


class IsStateLevelOrAbove(BasePermission):
    message = "State Director access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY.get('STATE_DIRECTOR', 6)


class IsAdminUser(BasePermission):
    """Any admin-level user — STATE_DIRECTOR and above."""
    message = "Admin access required."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY.get('STATE_DIRECTOR', 6)


class CanManageScope(BasePermission):
    """Users can only manage entities within their geographic scope."""
    message = "You can only manage members within your assigned area."

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = user.role

        if ROLE_HIERARCHY.get(role, 0) >= ROLE_HIERARCHY.get('NATIONAL_OFFICER', 8):
            return True

        profile = getattr(obj, 'memberprofile', None) or obj
        try:
            user_profile = request.user.profile
        except Exception:
            return False

        if role == 'STATE_DIRECTOR':
            return getattr(profile, 'state_id', None) == user_profile.state_id

        if role == 'LGA_COORDINATOR':
            return getattr(profile, 'lga_id', None) == user_profile.lga_id

        if role == 'WARD_COORDINATOR':
            return getattr(profile, 'ward_id', None) == user_profile.ward_id

        return False
