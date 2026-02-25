"""
[AI] Utility Functions - Stock Data
Functions for fetching stock prices, calculating metrics, and portfolio performance
"""

# [AI] Portfolio Metrics Calculation
def calculate_holding_value(quantity, current_price):
    """
    Calculate total value of a holding
    Args:
        quantity (int): Number of shares
        current_price (float): Current price per share
    Returns:
        float: Total value of holding
    """
    return quantity * current_price


def calculate_gain_loss(purchase_price, current_price, quantity):
    """
    Calculate gain or loss on a holding
    Args:
        purchase_price (float): Average purchase price
        current_price (float): Current market price
        quantity (int): Number of shares
    Returns:
        dict: Contains gain_loss_amount and gain_loss_percentage
    """
    total_cost = purchase_price * quantity
    current_value = current_price * quantity
    gain_loss_amount = current_value - total_cost
    gain_loss_percentage = (gain_loss_amount / total_cost * 100) if total_cost != 0 else 0
    
    return {
        'amount': round(gain_loss_amount, 2),
        'percentage': round(gain_loss_percentage, 2),
        'is_positive': gain_loss_amount >= 0
    }


def calculate_portfolio_metrics(holdings_list, cash_balance):
    """
    Calculate overall portfolio metrics
    Args:
        holdings_list (list): List of holding dictionaries with quantity, average_cost, current_price
        cash_balance (float): Current cash in portfolio
    Returns:
        dict: Portfolio metrics including total value, total gains, etc.
    """
    total_value = cash_balance
    total_invested = 0
    total_gain_loss = 0
    
    for holding in holdings_list:
        holding_value = calculate_holding_value(holding['quantity'], holding['current_price'])
        total_value += holding_value
        
        cost = holding['quantity'] * holding['average_cost']
        total_invested += cost
        
        gain_loss = holding['quantity'] * (holding['current_price'] - holding['average_cost'])
        total_gain_loss += gain_loss
    
    portfolio_performance = (total_gain_loss / total_invested * 100) if total_invested != 0 else 0
    
    return {
        'total_value': round(total_value, 2),
        'total_invested': round(total_invested, 2),
        'cash_balance': round(cash_balance, 2),
        'total_gain_loss': round(total_gain_loss, 2),
        'portfolio_performance_percentage': round(portfolio_performance, 2),
        'number_of_holdings': len(holdings_list)
    }


# [AI] Transaction Processing
def process_buy_transaction(balance, quantity, price):
    """
    Validate and calculate buy transaction
    Args:
        balance (float): Current portfolio balance
        quantity (int): Number of shares to buy
        price (float): Price per share
    Returns:
        dict: Contains success status, new balance, and message
    """
    total_cost = quantity * price
    
    if total_cost > balance:
        return {
            'success': False,
            'message': f'Insufficient funds. Need ${total_cost:.2f}, have ${balance:.2f}',
            'new_balance': balance
        }
    
    new_balance = balance - total_cost
    return {
        'success': True,
        'message': 'Buy transaction successful',
        'new_balance': round(new_balance, 2),
        'total_cost': round(total_cost, 2)
    }


def process_sell_transaction(quantity_owned, quantity_to_sell, price, current_balance):
    """
    Validate and calculate sell transaction
    Args:
        quantity_owned (int): Number of shares currently owned
        quantity_to_sell (int): Number of shares to sell
        price (float): Price per share
        current_balance (float): Current portfolio balance
    Returns:
        dict: Contains success status, new balance, and message
    """
    if quantity_to_sell > quantity_owned:
        return {
            'success': False,
            'message': f'Cannot sell {quantity_to_sell} shares, only own {quantity_owned}',
            'new_balance': current_balance
        }
    
    proceeds = quantity_to_sell * price
    new_balance = current_balance + proceeds
    
    return {
        'success': True,
        'message': 'Sell transaction successful',
        'new_balance': round(new_balance, 2),
        'proceeds': round(proceeds, 2)
    }
