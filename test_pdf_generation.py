#!/usr/bin/env python3
"""
Test script to process just first 3 records for debugging
"""

import os
import pandas as pd
from datetime import datetime

# Check files
documents_projects_dir = os.path.expanduser("~/Documents/Projects")
excel_path = os.path.join(documents_projects_dir, "Email + Address List.xlsx")

print("Checking files...")
print(f"Excel exists: {os.path.exists(excel_path)}")
print(f"Individual.docx exists: {os.path.exists(os.path.join(documents_projects_dir, 'Individual.docx'))}")
print(f"Entity.docx exists: {os.path.exists(os.path.join(documents_projects_dir, 'Entity.docx'))}")
print(f"DOA folder exists: {os.path.exists(os.path.join(documents_projects_dir, 'DOA Stamp Papers'))}")

# Read Excel
df = pd.read_excel(excel_path)
print(f"\nFound {len(df)} records")
print(f"Columns: {df.columns.tolist()}")

# Show first 3 records
print("\nFirst 3 records:")
for idx, row in df.head(3).iterrows():
    name = row.get('Name of the Shareholder', 'Unknown')
    entity = row.get('Entity', 'Individual')
    email = row.get('Email', 'N/A')
    print(f"{idx+1}. {name} ({entity}) - {email}")

# Check stamp papers
stamp_folder = os.path.join(documents_projects_dir, "DOA Stamp Papers")
if os.path.exists(stamp_folder):
    import glob
    stamp_papers = glob.glob(os.path.join(stamp_folder, "*.pdf"))
    print(f"\nFound {len(stamp_papers)} stamp papers")
    if stamp_papers:
        print(f"First stamp paper: {os.path.basename(stamp_papers[0])}")