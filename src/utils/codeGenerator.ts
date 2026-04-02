import { WorkflowStep } from '../types';

export const generatePythonPipeline = (
  projectName: string,
  filename: string,
  workflowHistory: WorkflowStep[]
): string => {
  let code = `"""
DataInsight Pro - Automated Data Pipeline
Project: ${projectName}
Generated at: ${new Date().toISOString()}
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler, StandardScaler

def run_pipeline(input_file_path: str, output_file_path: str):
    print(f"Loading data from {input_file_path}...")
    
    # 1. Load the data
    if input_file_path.endswith('.csv'):
        df = pd.read_csv(input_file_path)
    elif input_file_path.endswith('.json'):
        df = pd.read_json(input_file_path)
    else:
        df = pd.read_excel(input_file_path)

    initial_rows = len(df)
`;

  if (workflowHistory.length === 0) {
    code += `    print("No transformation steps recorded.")\n`;
  }

  let stepCounter = 2; // Step 1 is loading
  
  workflowHistory.forEach((step) => {
    code += `\n    # Step ${stepCounter}: ${step.description}\n`;
    
    // --- Cleaning ---
    if (step.action === 'cleaning') {
      const opts = step.parameters?.options;
      if (opts) {
        if (opts.removeNulls) {
          code += `    df = df.dropna()\n`;
        }
        if (opts.removeEmptyRows) {
          code += `    df = df.dropna(how='all')\n`;
        }
        if (opts.removeEmptyColumns) {
          code += `    df = df.dropna(axis=1, how='all')\n`;
        }
        if (opts.removeDuplicates) {
          code += `    df = df.drop_duplicates()\n`;
        }
        if (opts.trimWhitespace) {
          code += `    df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)\n`;
        }
        if (opts.capitalizeHeaders) {
          code += `    df.columns = [str(c).capitalize() for c in df.columns]\n`;
        }
        if (opts.fixDataTypes) {
          code += `    # Attempt to convert object columns to numeric where possible\n`;
          code += `    for col in df.select_dtypes(include=['object']).columns:\n`;
          code += `        df[col] = pd.to_numeric(df[col], errors='ignore')\n`;
        }
      }
    }

    // --- Transformation ---
    else if (step.action === 'transformation') {
      const type = step.parameters?.transformationType;
      const cols = step.affectedColumns;
      
      if (!cols || cols.length === 0) return;
      
      const colStr = `[${cols.map((c: string) => `"${c}"`).join(', ')}]`;

      if (type === 'normalize') {
        code += `    scaler = MinMaxScaler()\n`;
        code += `    df[${colStr}] = scaler.fit_transform(df[${colStr}])\n`;
      } 
      else if (type === 'standardize') {
        code += `    scaler = StandardScaler()\n`;
        code += `    df[${colStr}] = scaler.fit_transform(df[${colStr}])\n`;
      }
      else if (type === 'log') {
        code += `    # Added np.abs to prevent log of negative numbers\n`;
        code += `    df[${colStr}] = np.log1p(np.abs(df[${colStr}]))\n`;
      }
      else if (type === 'sqrt') {
        code += `    df[${colStr}] = np.sqrt(np.abs(df[${colStr}]))\n`;
      }
      else if (type === 'encode') {
        code += `    df = pd.get_dummies(df, columns=${colStr}, drop_first=True)\n`;
      }
      else if (type === 'fill_missing') {
          const method = step.parameters?.method;
          if (method === 'mean') code += `    df[${colStr}] = df[${colStr}].fillna(df[${colStr}].mean())\n`;
          if (method === 'median') code += `    df[${colStr}] = df[${colStr}].fillna(df[${colStr}].median())\n`;
          if (method === 'mode') code += `    df[${colStr}] = df[${colStr}].fillna(df[${colStr}].mode().iloc[0])\n`;
      }
    }
    
    // --- Upload/Init Logging ---
    else if (step.action === 'upload') {
       code += `    # Initialization logged via GUI. Nothing to apply dynamically here.\n`;
    }

    stepCounter++;
  });

  code += `
    # Final Summary
    final_rows = len(df)
    print(f"Pipeline complete. Rows reduced from {initial_rows} to {final_rows}.")
    
    # Exporting
    print(f"Saving output to {output_file_path}...")
    if output_file_path.endswith('.csv'):
        df.to_csv(output_file_path, index=False)
    elif output_file_path.endswith('.json'):
        df.to_json(output_file_path, orient='records')
    else:
        df.to_excel(output_file_path, index=False)
        
    return df

if __name__ == "__main__":
    # Change these paths to your local file paths
    INPUT_FILE = "${filename || 'dataset.csv'}"
    OUTPUT_FILE = "${projectName.replace(/\\s+/g, '_').toLowerCase()}_cleaned.csv"
    
    run_pipeline(INPUT_FILE, OUTPUT_FILE)
`;

  return code;
};
