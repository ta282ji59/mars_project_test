import psycopg2
import pandas as pd

# データベース接続情報
db_params = {
    'dbname': 'mars',
    'user': 'ta282ji',
    'password': 'triathlon',
    'host': '172.16.238.5',
    'port': '5432'
}

# 作成するテーブル名とCSVファイルパス
table_name = 'themis'
csv_file_path = 'themis.csv'

# データベースに接続
conn = psycopg2.connect(**db_params)
conn.autocommit = True
cursor = conn.cursor()

try:
    # CSVファイルを読み込み、DataFrameに変換（ヘッダーを除外）
    df = pd.read_csv(csv_file_path, skiprows=1)

    # データを挿入
    for _, row in df.iterrows():
        values = []
        for value in row.values:
            # 値が空の場合はNoneに変換（psycopg2はNoneをNULLとして扱います）
            if pd.isna(value):
                values.append(None)
            else:
                values.append(value)
        
        # プレースホルダーを作成
        placeholders = ', '.join(['%s'] * len(values))
        
        # SQL文の実行（パラメータ化されたクエリを使用）
        cursor.execute(f"INSERT INTO {table_name} VALUES ({placeholders});", values)

    print("CSVファイルのデータがテーブルに挿入されました。")

except Exception as e:
    print(f"エラーが発生しました: {e}")
finally:
    cursor.close()
    conn.close()
