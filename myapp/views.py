from django.shortcuts import render
from .models import *
from .serializers import *
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .utils import get_ai_summary
from django.views.generic import TemplateView
from django.contrib.auth.views import LogoutView
from rest_framework.permissions import AllowAny,IsAuthenticated

class CustomUserViewSet(ModelViewSet):
    def get_queryset(self):
        return CustomUser.objects.all()
    
    def get_serializer(self, *args, **kwargs):
        return CustomUserSerializer(*args,context=self.get_serializer_context(),**kwargs)
    
    def get_serializer_context(self):
        return {'request':self.request}

class BugReporterViewSet(ModelViewSet):
    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        return BugReporter.objects.all()
    
    def create(self, request, *args, **kwargs):
        data = request.data
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        bug = serializer.save(user = request.user)

        get_ai_summary(bug)

        return Response(serializer.data,status=status.HTTP_201_CREATED)
    
    def get_serializer(self, *args, **kwargs):
        return BugReporterSerializer(*args,context=self.get_serializer_context(),**kwargs)
    
    def get_serializer_context(self):
        return {'request' : self.request}
    
class LogoutConfirmView(TemplateView):
    template_name = "myapp/logout.html"

class LogOutView(LogoutView):
    http_method_names = ['post']
    next_page = 'login'
    
def home(request):
    return render(request,'myapp/home.html',{'title':'Home | AI Bug Reporter'})

def login(request):
    return render(request,"myapp/login.html",{'title':'Login | AI Bug Reporter'})

# Create your views here.
