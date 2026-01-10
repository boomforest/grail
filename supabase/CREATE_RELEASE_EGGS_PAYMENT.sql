-- ============================================
-- CREATE release_eggs_payment FUNCTION
-- This function allows a sender to release pending Eggs payment
-- ============================================

DROP FUNCTION IF EXISTS release_eggs_payment(UUID);

CREATE OR REPLACE FUNCTION release_eggs_payment(p_egg_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_id UUID;
  v_recipient_id UUID;
  v_pending_amount INTEGER;
  v_sender_username TEXT;
BEGIN
  -- Get egg transaction details and verify sender
  SELECT sender_id, recipient_id, pending_amount, sender.username
  INTO v_sender_id, v_recipient_id, v_pending_amount, v_sender_username
  FROM eggs_transactions
  JOIN profiles sender ON sender.id = eggs_transactions.sender_id
  WHERE eggs_transactions.id = p_egg_id
    AND eggs_transactions.status = 'pending'
    AND eggs_transactions.sender_id = auth.uid();

  -- Check if egg was found and user is the sender
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Egg transaction not found or you are not the sender';
  END IF;

  -- Update eggs_transaction to approved
  UPDATE eggs_transactions
  SET status = 'approved',
      reviewed_at = NOW(),
      resolved_at = NOW()
  WHERE id = p_egg_id;

  -- Create paloma_transaction for pending amount
  INSERT INTO paloma_transactions (user_id, amount, source, received_at, expires_at)
  VALUES (
    v_recipient_id,
    v_pending_amount,
    'eggs_approved_from_' || v_sender_username,
    NOW(),
    NOW() + INTERVAL '1 year'
  );

  -- Update recipient balance and reduce their eggs_pending_received
  UPDATE profiles
  SET dov_balance = dov_balance + v_pending_amount,
      eggs_pending_received = GREATEST(0, COALESCE(eggs_pending_received, 0) - v_pending_amount),
      last_status_update = NOW()
  WHERE id = v_recipient_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION release_eggs_payment(UUID) TO authenticated;

SELECT 'release_eggs_payment function created! ✅' as status;
