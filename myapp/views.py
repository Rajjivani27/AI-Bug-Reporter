from django.shortcuts import render
from .models import *
from .serializers import *
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status

class BugReporterViewSet(ModelViewSet):
    def get_queryset(self):
        return BugReporter.objects.all()
    
    def get_serializer(self, *args, **kwargs):
        return BugReporterSerializer(*args,context=self.get_serializer_context(),**kwargs)
    
    def get_serializer_context(self):
        return {'request' : self.request}

# Create your views here.
