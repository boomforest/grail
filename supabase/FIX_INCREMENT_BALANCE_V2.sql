-- ============================================
-- CREATE increment_balance FUNCTION (V2)
-- This completely drops and recreates the function
-- ============================================

-- Drop the function if it exists (with all possible signatures)
DROP FUNCTION IF EXISTS increment_balance(UUID, INTEGER);
DROP FUNCTION IF EXISTS increment_balance(p_user_id UUID, p_amount INTEGER);

-- Create the function with correct signature
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

-- Verify the function exists
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'increment_balance';

SELECT 'increment_balance function created and verified! ✅' as status;
