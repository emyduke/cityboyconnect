from rest_framework.permissions import BasePermission
from apps.accounts.models import ROLE_HIERARCHY


class IsVerifiedMember(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_verified


class IsCoordinatorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY['WARD_COORDINATOR']


class IsLGACoordinatorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY['LGA_COORDINATOR']


class IsStateDirectorOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY['STATE_DIRECTOR']


class IsNationalOfficerOrAbove(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return ROLE_HIERARCHY.get(request.user.role, 0) >= ROLE_HIERARCHY['NATIONAL_OFFICER']


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role == 'SUPER_ADMIN'


def get_scoped_queryset(user, queryset, state_field='state', lga_field='lga', ward_field='ward'):
    """Filter queryset based on user's geographic scope."""
    role = user.role
    if role in ('SUPER_ADMIN', 'NATIONAL_OFFICER'):
        return queryset

    try:
        profile = user.profile
    except Exception:
        return queryset.none()

    if role == 'STATE_DIRECTOR':
        if profile.state:
            return queryset.filter(**{state_field: profile.state})
    elif role == 'LGA_COORDINATOR':
        if profile.lga:
            return queryset.filter(**{lga_field: profile.lga})
    elif role == 'WARD_COORDINATOR':
        if profile.ward:
            return queryset.filter(**{ward_field: profile.ward})

    # Regular members see their own scope
    if profile.state:
        return queryset.filter(**{state_field: profile.state})
    return queryset.none()
