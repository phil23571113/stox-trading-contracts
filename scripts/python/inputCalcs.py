import math

# Given Pool Data
sqrtPriceX96 = 250541448375047948078879969925660672
tick_current = 299351

# Define tickLower and tickUpper (adjust as needed)
tickLower = 299151  # Must be multiple of tick spacing
tickUpper = 299551

# Tick formula: sqrt(P) = 1.0001^(tick/2)
def tick_to_sqrt_price(tick):
    return math.pow(1.0001, tick / 2)

sqrtP_current = sqrtPriceX96 / (2**96)
sqrtP_lower = tick_to_sqrt_price(tickLower)
sqrtP_upper = tick_to_sqrt_price(tickUpper)

# Assume liquidity L (choose based on capital available)
L = 10**18  # Example liquidity amount

# Calculate token amounts
amount0 = L * (sqrtP_upper - sqrtP_current) / (sqrtP_current * sqrtP_upper)
amount1 = L * (sqrtP_current - sqrtP_lower)

print("tickLower:", tickLower)
print("tickUpper:", tickUpper)
print("amount0Desired:", amount0)
print("amount1Desired:", amount1)