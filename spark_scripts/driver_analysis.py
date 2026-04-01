import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum, max as _max

# 1. 初始化 Spark
spark = SparkSession.builder \
    .appName("DriveGuard_Analysis") \
    .master("local[*]") \
    .getOrCreate()

# 2. 定義路徑
input_path = "data/detail_record_*" 
output_path = "data/summary_result"

print(f"正在尋找原始數據: {input_path}")

# 3. 讀取數據
try:
    df = spark.read.option("header", "false").csv(input_path)
    count = df.count()
    print(f"成功讀取到 {count} 條記錄。")
except Exception as e:
    print(f"讀取失敗！請確保 data/ 目錄下有 detail_record_* 文件。錯誤: {e}")
    spark.stop()
    exit(1)

# 4. 重命名欄位 (19 個欄位)
columns = [
    "driverID", "carPlateNumber", "Latitude", "Longtitude", "Speed",
    "Direction", "siteName", "Time", "isRapidlySpeedup", "isRapidlySlowdown",
    "isNeutralSlide", "isNeutralSlideFinished", "neutralSlideTime",
    "isOverspeed", "isOverspeedFinished", "overspeedTime",
    "isFatigueDriving", "isHthrottleStop", "isOilLeak"
]

for i, name in enumerate(columns):
    df = df.withColumnRenamed(f"_c{i}", name)

# 5. 類型轉換
cast_cols = ["isOverspeed", "isFatigueDriving", "overspeedTime", "neutralSlideTime"]
for c in cast_cols:
    df = df.withColumn(c, col(c).cast("int"))

# 6. 聚合計算
summary_df = df.groupBy("driverID", "carPlateNumber").agg(
    _sum("isOverspeed").alias("overspeed_times"),
    _sum("isFatigueDriving").alias("fatigue_times"),
    _sum("overspeedTime").alias("overspeed_time_seconds"),
    _sum("neutralSlideTime").alias("neutral_slide_time_seconds")
)

# 7. 保存結果 (保存到文件夾中)
print(f"正在保存結果到文件夾: {output_path} ...")
summary_df.write.mode("overwrite").option("header", "true").csv(output_path)

print("--------------------------------------------------")
print(f"分析完成！")
print(f"請到此目錄查看結果: {os.path.abspath(output_path)}")
print(f"你會看到以 'part-' 開頭的 .csv 文件，那就是網頁需要的數據。")
print("--------------------------------------------------")

spark.stop()
