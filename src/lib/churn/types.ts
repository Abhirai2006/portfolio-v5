/** One telecom customer: the 19 input columns of IBM's Telco dataset, as the model sees them. */
export type Customer = {
  gender: string;
  SeniorCitizen: number;
  Partner: string;
  Dependents: string;
  tenure: number;
  PhoneService: string;
  MultipleLines: string;
  InternetService: string;
  OnlineSecurity: string;
  OnlineBackup: string;
  DeviceProtection: string;
  TechSupport: string;
  StreamingTV: string;
  StreamingMovies: string;
  Contract: string;
  PaperlessBilling: string;
  PaymentMethod: string;
  MonthlyCharges: number;
  TotalCharges: number;
};
export type Column = keyof Customer;

export type Leaf = { v: number; c: number };
export type Split = { f: number; t: number; dl: boolean; c: number; l: Node; r: Node };
export type Node = Leaf | Split;

/** Shape of src/data/churn/model.json (written by ml/export_churn.py). */
export type ModelJson = {
  threshold: number;
  numeric: { name: Column; mean: number; scale: number }[];
  categorical: { name: Column; categories: string[] }[];
  featureNames: string[];
  trees: Node[];
};

/** Shape of src/data/churn/test-set.json: rows are [values in `columns` order, churned, python probability]. */
export type TestSetJson = { columns: Column[]; rows: [Array<string | number>, number, number][] };
export type TestRow = { x: Customer; y: 0 | 1; p: number };
