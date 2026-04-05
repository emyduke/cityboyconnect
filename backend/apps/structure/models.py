from django.db import models


class GeopoliticalZone(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        app_label = 'structure'
        ordering = ['name']

    def __str__(self):
        return self.name


class State(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)
    zone = models.ForeignKey(GeopoliticalZone, on_delete=models.PROTECT, related_name='states')

    class Meta:
        app_label = 'structure'
        ordering = ['name']

    def __str__(self):
        return self.name


class LocalGovernment(models.Model):
    name = models.CharField(max_length=100)
    state = models.ForeignKey(State, on_delete=models.CASCADE, related_name='lgas')

    class Meta:
        app_label = 'structure'
        ordering = ['name']
        verbose_name = 'Local Government Area'

    def __str__(self):
        return f'{self.name}, {self.state.name}'


class Ward(models.Model):
    name = models.CharField(max_length=100)
    lga = models.ForeignKey(LocalGovernment, on_delete=models.CASCADE, related_name='wards')
    ward_code = models.CharField(max_length=20, blank=True)

    class Meta:
        app_label = 'structure'
        ordering = ['name']

    def __str__(self):
        return f'{self.name}, {self.lga.name}'


class PollingUnit(models.Model):
    name = models.CharField(max_length=200)
    ward = models.ForeignKey(Ward, on_delete=models.CASCADE, related_name='polling_units')
    inec_code = models.CharField(max_length=30, blank=True)

    class Meta:
        app_label = 'structure'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.ward.name})'
