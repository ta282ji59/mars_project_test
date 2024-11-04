FROM python:3.9

# 必要なシステムパッケージをインストール
RUN apt-get update && \
    apt-get install -y gdal-bin libgdal-dev python3-gdal && \
    apt-get clean

# GDALの環境変数を設定
ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係ファイルをコピー
COPY requirements.txt /app/

# 依存関係をインストール
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . /app/

# ポートを公開
EXPOSE 8000

# サーバーを起動
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
