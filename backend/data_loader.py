import pandas as pd
import boto3
import os
import time
from datetime import datetime, timedelta
import random

# Configuration - can be overridden by environment variables
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
ATHENA_DATABASE = os.getenv('ATHENA_DATABASE', 'your_database_name')
ATHENA_TABLE = os.getenv('ATHENA_TABLE', 'your_table_name')
ATHENA_OUTPUT_LOCATION = os.getenv('ATHENA_OUTPUT_LOCATION', 's3://your-bucket/athena-results/')
USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'true').lower() == 'true'

def load_data_from_athena():
    """
    Load phone price data from AWS Athena.
    Returns a pandas DataFrame with columns: color, ram, storage, price, timestamp, model
    """
    try:
        # Initialize Athena client
        athena_client = boto3.client('athena', region_name=AWS_REGION)
        
        # SQL query to fetch all data
        query = f"""
        SELECT 
            color,
            ram,
            storage,
            price,
            timestamp,
            model
        FROM {ATHENA_DATABASE}.{ATHENA_TABLE}
        ORDER BY timestamp DESC
        """
        
        # Execute query
        response = athena_client.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            ResultConfiguration={'OutputLocation': ATHENA_OUTPUT_LOCATION}
        )
        
        query_execution_id = response['QueryExecutionId']
        
        # Wait for query to complete
        max_attempts = 30
        attempt = 0
        while attempt < max_attempts:
            query_status = athena_client.get_query_execution(QueryExecutionId=query_execution_id)
            status = query_status['QueryExecution']['Status']['State']
            
            if status == 'SUCCEEDED':
                break
            elif status in ['FAILED', 'CANCELLED']:
                error_msg = query_status['QueryExecution']['Status'].get('StateChangeReason', 'Unknown error')
                raise Exception(f"Athena query failed: {error_msg}")
            
            time.sleep(1)
            attempt += 1
        
        if attempt >= max_attempts:
            raise Exception("Athena query timed out")
        
        # Get query results
        results = athena_client.get_query_results(QueryExecutionId=query_execution_id)
        
        # Parse results into DataFrame
        rows = results['ResultSet']['Rows']
        
        # Skip header row
        data_rows = rows[1:]
        
        # Extract data
        data = []
        for row in data_rows:
            data.append({
                'color': row['Data'][0].get('VarCharValue', ''),
                'ram': row['Data'][1].get('VarCharValue', ''),
                'storage': row['Data'][2].get('VarCharValue', ''),
                'price': float(row['Data'][3].get('VarCharValue', 0)),
                'timestamp': row['Data'][4].get('VarCharValue', ''),
                'model': row['Data'][5].get('VarCharValue', '')
            })
        
        df = pd.DataFrame(data)
        print(f"✅ Successfully loaded {len(df)} records from Athena")
        return df
        
    except Exception as e:
        print(f"❌ Error loading data from Athena: {str(e)}")
        print("⚠️  Falling back to mock data")
        return load_mock_data()

def load_mock_data():
    """
    Load mock phone price data for testing/development.
    Returns a pandas DataFrame with synthetic data.
    """
    # Sample data from user + synthetic historical data
    base_data = [
        {"color": "Cobalt Violet", "ram": "8GB", "storage": "128GB", "price": 49999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Onyx Black", "ram": "8GB", "storage": "128GB", "price": 40999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Amber Yellow", "ram": "8GB", "storage": "256GB", "price": 45999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Cobalt Violet", "ram": "8GB", "storage": "256GB", "price": 55999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Marble Grey", "ram": "8GB", "storage": "256GB", "price": 45999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Cosmic Blue", "ram": "8GB", "storage": "128GB", "price": 18499.0, "model": "VIVO_T3_5G"},
        {"color": "Marble Grey", "ram": "8GB", "storage": "128GB", "price": 40999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Crystal Flake", "ram": "8GB", "storage": "256GB", "price": 20499.0, "model": "VIVO_T3_5G"},
        {"color": "Cosmic Blue", "ram": "8GB", "storage": "256GB", "price": 20499.0, "model": "VIVO_T3_5G"},
        {"color": "Amber Yellow", "ram": "8GB", "storage": "128GB", "price": 40999.0, "model": "SAMSUNG_GALAXY_S24"},
        {"color": "Crystal Flake", "ram": "8GB", "storage": "128GB", "price": 18499.0, "model": "VIVO_T3_5G"},
        {"color": "Onyx Black", "ram": "8GB", "storage": "256GB", "price": 45999.0, "model": "SAMSUNG_GALAXY_S24"},
    ]
    
    # Generate historical data (last 30 days)
    all_records = []
    current_date = datetime.now()
    
    for days_ago in range(30, -1, -1):
        timestamp = current_date - timedelta(days=days_ago)
        
        for item in base_data:
            # Add some price variation for historical data
            price_variation = random.uniform(-0.05, 0.05) if days_ago > 0 else 0
            adjusted_price = item["price"] * (1 + price_variation)
            
            record = {
                "color": item["color"],
                "ram": item["ram"],
                "storage": item["storage"],
                "price": round(adjusted_price, 2),
                "timestamp": timestamp.isoformat(),
                "model": item["model"]
            }
            all_records.append(record)
    
    df = pd.DataFrame(all_records)
    print(f"📊 Using mock data: {len(df)} records")
    return df

def load_data():
    """
    Main function to load phone price data.
    Uses Athena if USE_MOCK_DATA=false, otherwise uses mock data.
    """
    if USE_MOCK_DATA:
        return load_mock_data()
    else:
        return load_data_from_athena()
