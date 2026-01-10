-- ============================================
-- CREATE increment_balance FUNCTION
-- This function safely updates user balances
-- ============================================

CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET dov_balance = dov_balance + p_amount,
      last_status_update = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_balance(UUID, INTEGER) TO authenticated;

SELECT 'increment_balance function created! ✅' as status;
