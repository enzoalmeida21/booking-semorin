-- Corrige erro ao criar usuário no Auth: trigger insería promotor sem CPF

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS cpf_required_for_promotor;

ALTER TABLE profiles ADD CONSTRAINT cpf_required_for_promotor CHECK (
  role != 'promotor'
  OR cpf IS NOT NULL
  OR status IN ('pendente', 'inativo')
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
  v_status promotor_status;
BEGIN
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'promotor'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'promotor'::user_role;
  END;

  v_status := CASE
    WHEN v_role = 'promotor'::user_role THEN 'pendente'::promotor_status
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, role, nome, email, status)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    v_status
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
