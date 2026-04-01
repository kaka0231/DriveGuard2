import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, sum as _sum

# 1. 初始化 Spark
spark = SparkSession.builder \
    .appName("DriveGuard_Analysis") \
    .master("local[*]") \
    .getOrCreate()

# 2. 定義路徑 - 注意：這裡必須是 detail_record_* (下劃線)
input_path = "data/detail_record_*" 
output_path = "data/summary_result"

print(f"--- 開始分析 ---")
print(f"正在讀取數據: {input_path}")

# 3. 讀取數據
try:
    # 直接讀取 CSV，Spark 會自動處理逗號分隔
    df = spark.read.option("header", "false").csv(input_path)
    
    # 檢查是否讀取到數據
    row_count = df.count()
    if row_count == 0:
        print("!!! 錯誤：讀取到 0 行數據。請檢查 data/ 目錄下是否有 detail_record_ 開頭的文件。")
        spark.stop()
        exit(1)
    print(f"成功讀取到 {row_count} 條記錄。")

    # 4. 重命名欄位 (根據 19 欄位定義)
    columns = [
        "driverID", "carPlateNumber", "Latitude", "Longtitude", "Speed",
        "Direction", "siteName", "Time", "isRapidlySpeedup", "isRapidlySlowdown",
        "isNeutralSlide", "isNeutralSlideFinished", "neutralSlideTime",
        "isOverspeed", "isOverspeedFinished", "overspeedTime",
        "isFatigueDriving", "isHthrottleStop", "isOilLeak"
    ]
    
    for i, name in enumerate(columns):
        df = df.withColumnRenamed(f"_c{i}", name)

    # 5. 類型轉換並聚合
    # 將超速標誌 (第 14 欄位) 和 疲勞標誌 (第 17 欄位) 轉為整數求和
    summary_df = df.select(
        "driverID", 
        "carPlateNumber", 
        col("isOverspeed").cast("int"), 
        col("isFatigueDriving").cast("int"),
        col("overspeedTime").cast("int"),
        col("neutralSlideTime").cast("int")
    ).groupBy("driverID", "carPlateNumber").agg(
        _sum("isOverspeed").alias("overspeed_times"),
        _sum("isFatigueDriving").alias("fatigue_times"),
        _sum("overspeedTime").alias("overspeed_time_seconds"),
        _sum("neutralSlideTime").alias("neutral_slide_time_seconds")
    )

    # 6. 顯示預覽
    print("\n分析結果預覽:")
    summary_df.show(5)

    # 7. 保存結果
    print(f"正在保存結果到: {output_path}")
    summary_df.write.mode("overwrite").option("header", "true").csv(output_path)

    print(f"\n分析完成！")
    print(f"請查看文件夾: {os.path.abspath(output_path)}")
    print(f"數據就在裡面的 part-xxxx.csv 文件中。")

except Exception as e:
    print(f"發生錯誤: {e}")

finally:
    spark.stop()
