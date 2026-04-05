from apps.accounts.models import AuditLog


def log_action(performed_by, action, target=None, before_state=None, after_state=None, request=None, notes=''):
    """Log every sensitive admin action. Never skip this."""
    target_type = ''
    target_id = 0

    if target is not None:
        target_type = target.__class__.__name__
        target_id = getattr(target, 'pk', 0) or 0

    ip_address = None
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            ip_address = x_forwarded.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR')

    details = {}
    if before_state:
        details['before'] = before_state
    if after_state:
        details['after'] = after_state
    if notes:
        details['notes'] = notes

    AuditLog.objects.create(
        user=performed_by,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
        ip_address=ip_address,
    )
