from rest_framework import serializers
from .models import *

class BugReporterSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReporter
        fields = "__all__"

