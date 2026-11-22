import { describe, expect, test } from "bun:test";
import testSet from "@/data/churn/test-set.json";
import { testRows } from "@/lib/churn/data";
import { BUDGET, MOVES, play, startGame } from "@/lib/churn/game";

const rows = testRows(testSet as never);
const THRESHOLD = 0.48477971204830717;

describe("save the customer", () => {
  test("a seed always picks the same at-risk customer", () => {
    const a = startGame(rows, THRESHOLD, 7);
    const b = startGame(rows, THRESHOLD, 7);
    expect(a.customer).toEqual(b.customer);
    expect(a.startP).toBeGreaterThanOrEqual(THRESHOLD);
    expect(a.spent).toBe(0);
    expect(BUDGET).toBe(100);
  });

  test("costs are the planned illustrative prices", () => {
    expect(Object.fromEntries(MOVES.map((m) => [m.id, m.cost]))).toEqual({
      contract1y: 60,
      techSupport: 25,
      onlineSecurity: 20,
      discount10: 30,
    });
  });

  test("playing a move deducts its cost, records it and changes the customer", () => {
    const s0 = startGame(rows, THRESHOLD, 3);
    const s1 = play(s0, "contract1y");
    expect(s1.error).toBeUndefined();
    expect(s1.spent).toBe(60);
    expect(s1.played).toEqual(["contract1y"]);
    expect(s1.customer.Contract).toBe("One year");
  });

  test("discount sets MonthlyCharges to 90%, rounded to cents", () => {
    const s0 = startGame(rows, THRESHOLD, 3);
    const s1 = play(s0, "discount10");
    expect(s1.customer.MonthlyCharges).toBe(
      Math.round(s0.customer.MonthlyCharges * 0.9 * 100) / 100,
    );
  });

  test("the same move twice is refused", () => {
    const s1 = play(startGame(rows, THRESHOLD, 3), "techSupport");
    const s2 = play(s1, "techSupport");
    expect(s2.error).toBeDefined();
    expect(s2.spent).toBe(s1.spent);
    expect(s2.customer).toEqual(s1.customer);
  });

  test("going over budget is refused", () => {
    const s1 = play(startGame(rows, THRESHOLD, 3), "contract1y"); // 60
    const s2 = play(s1, "techSupport"); // 85
    const s3 = play(s2, "discount10"); // would be 115
    expect(s3.error).toBeDefined();
    expect(s3.spent).toBe(85);
  });

  test("tech support cannot be sold to a customer without internet", () => {
    const s0 = startGame(rows, THRESHOLD, 3);
    const noNet = {
      ...s0,
      customer: { ...s0.customer, InternetService: "No", TechSupport: "No internet service" },
    };
    const s1 = play(noNet, "techSupport");
    expect(s1.error).toBeDefined();
    expect(s1.customer.TechSupport).toBe("No internet service");
  });
});
