from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum, max as _max, count

# 1. 初始化 Spark
spark = SparkSession.builder \
    .appName("DriveGuard_Analysis") \
    .getOrCreate()

# 2. 定義路徑 (本地測試路徑)
# 在 AWS EMR 上運行時，請將其改為 s3://你的桶名/detail_record_*
input_path = "data/detail_record_*" 
output_path = "data/summary_result"

# 3. 讀取數據 (假設為無表頭的 CSV/TXT)
df = spark.read.option("header", "false").csv(input_path)

# 4. 根據你提供的 19 個欄位定義進行重命名
# 參考自 Dataset Description PDF
columns = [
    "driverID", "carPlateNumber", "Latitude", "Longtitude", "Speed",
    "Direction", "siteName", "Time", "isRapidlySpeedup", "isRapidlySlowdown",
    "isNeutralSlide", "isNeutralSlideFinished", "neutralSlideTime",
    "isOverspeed", "isOverspeedFinished", "overspeedTime",
    "isFatigueDriving", "isHthrottleStop", "isOilLeak"
]

for i, name in enumerate(columns):
    df = df.withColumnRenamed(f"_c{i}", name)

# 5. 數據類型轉換 (將標記位轉換為整數，方便求和)
cast_cols = [
    "isRapidlySpeedup", "isRapidlySlowdown", "isNeutralSlide", 
    "neutralSlideTime", "isOverspeed", "overspeedTime", 
    "isFatigueDriving", "isHthrottleStop", "isOilLeak"
]

for c in cast_cols:
    df = df.withColumn(c, col(c).cast("int"))

# 6. 執行聚合計算 (按司機和車牌分組)
summary_df = df.groupBy("driverID", "carPlateNumber").agg(
    _sum("isOverspeed").alias("overspeed_times"),
    _sum("isFatigueDriving").alias("fatigue_times"),
    _sum("overspeedTime").alias("overspeed_time_seconds"),
    _sum("neutralSlideTime").alias("neutral_slide_time_seconds"),
    _sum("isRapidlySpeedup").alias("rapid_speedup_times"),
    _sum("isRapidlySlowdown").alias("rapid_slowdown_times"),
    _sum("isHthrottleStop").alias("hthrottle_stop_times"),
    _max("isOilLeak").alias("oil_leak_detected")
)

# 7. 保存結果
# 保存為 CSV 格式，方便網頁後端直接讀取
summary_df.write.mode("overwrite").option("header", "true").csv(output_path)

print(f"分析完成！結果已保存至: {output_path}")
spark.stop()
