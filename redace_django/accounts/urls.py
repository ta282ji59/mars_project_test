from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('signup/', views.signup_view, name='signup'),
    path('home/', views.users_home, name='home'),
    path('logout-confirm/', views.logout_confirm, name='logout_confirm'),
]
