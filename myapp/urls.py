from django.urls import path,include
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

router.register(r"bug_reporter",BugReporterViewSet,basename="bug_reporter")


urlpatterns = [
    
] + router.urls