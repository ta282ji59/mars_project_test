from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
import requests
from .forms import CustomUserCreationForm

# ログイン画面の制御関数
def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home') 
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'accounts/login.html')

# ログアウト時の関数
def logout_view(request):
    # Django からログアウト
    logout(request)

    # JupyterHub のログアウト URL を設定
    jupyterhub_logout_url = "http://192.168.1.53:7010/hub/logout"  # JupyterHub の URL に合わせて変更

    # JupyterHub からログアウトする非同期リクエストを送信
    try:
        requests.get(jupyterhub_logout_url, timeout=5)
    except requests.RequestException:
        # JupyterHub のログアウトリクエストが失敗してもエラーを無視する
        pass

    # Django のログインページにリダイレクト
    return redirect('login')

# サインインの際の画面制御関数
def signup_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Create your account perfectly') #login.htmlに送られる文章
            return redirect('login')
    else:
        form = CustomUserCreationForm()
    return render(request, 'accounts/signup.html', {'form': form})


# ログイン後に行ける画面制御関数
@login_required
def users_home(request):
    return render(request, 'home.html')

# ログインアウト前に移動する画面制御関数
@login_required
def logout_confirm(request):
    return render(request, 'accounts/logout.html')