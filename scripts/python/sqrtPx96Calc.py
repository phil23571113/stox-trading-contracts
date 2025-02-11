import math

# Intended human price: 0.1 (e.g., 0.1 STOX per USDT)
human_price = 10 

# Token decimals:
decimals_token0 = 6   # USDT
decimals_token1 = 18  # STOX

# Convert human price to raw price
# raw_price = human_price * (10^(decimals_token1 - decimals_token0))
raw_price = human_price * (10 ** (decimals_token1 - decimals_token0))
# For this example: raw_price = 0.1 * 10^(18 - 6) = 0.1 * 10^12 = 1e11

# Calculate sqrtPriceX96 using the raw price
sqrt_price_x96 = int(math.sqrt(raw_price) * (2 ** 96))
print("sqrtPriceX96 =", sqrt_price_x96)