import uuid

import django.db.models.deletion
from django.db import migrations, models


def populate_qr_tokens(apps, schema_editor):
    MemberProfile = apps.get_model("members", "MemberProfile")
    for profile in MemberProfile.objects.all():
        profile.onboarding_qr_token = uuid.uuid4().hex[:16]
        profile.save(update_fields=["onboarding_qr_token"])


class Migration(migrations.Migration):

    dependencies = [
        ("members", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="memberprofile",
            name="onboarding_qr_token",
            field=models.CharField(default="", max_length=64),
        ),
        migrations.RunPython(populate_qr_tokens, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="memberprofile",
            name="onboarding_qr_token",
            field=models.CharField(max_length=64, unique=True),
        ),
        migrations.AlterField(
            model_name="memberprofile",
            name="referred_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="direct_referrals",
                to="members.memberprofile",
            ),
        ),
    ]
