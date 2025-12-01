from django.shortcuts import render
from .models import *
from .serializers import *
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .utils import get_ai_summary

class BugReporterViewSet(ModelViewSet):
    def get_queryset(self):
        return BugReporter.objects.all()
    
    def create(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        bug = serializer.save()

        get_ai_summary(bug)

        return Response(serializer.data,status=status.HTTP_201_CREATED)
    
    def get_serializer(self, *args, **kwargs):
        return BugReporterSerializer(*args,context=self.get_serializer_context(),**kwargs)
    
    def get_serializer_context(self):
        return {'request' : self.request}

# Create your views here.
