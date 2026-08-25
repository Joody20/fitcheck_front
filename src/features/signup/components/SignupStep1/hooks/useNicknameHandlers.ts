import { useCallback, useRef, useState } from "react";
import type { UseFormTrigger, FieldValues, Path } from "react-hook-form";

export function useNicknameHandlers<T extends FieldValues>(
  trigger: UseFormTrigger<T>,
  nicknamePath: Path<T>,
) {
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [verifiedNickname, setVerifiedNickname] = useState<string>("");

  // 🔒 중복 클릭 방지 (race condition 방어)
  const checkingRef = useRef(false);

  const handleDuplicateCheck = useCallback(
    async (nickname: string) => {
      if (checkingRef.current) return false;

      checkingRef.current = true;
      setIsChecking(true);
      setDuplicateError(null);
      setDuplicateSuccess(null);

      try {
        const isValid = await trigger(nicknamePath);
        if (!isValid) {
          setDuplicateError("닉네임 형식을 확인해주세요.");
          return false;
        }

        // Nicknames are local-only in the frontend demo.
        const isAvailable = nickname.trim().length > 0;

        if (isAvailable === true) {
          setVerifiedNickname(nickname);
          setDuplicateSuccess("사용 가능한 닉네임입니다.");
          return true;
        }

        if (isAvailable === false) {
          setDuplicateError("이미 사용 중인 닉네임입니다.");
          return false;
        }

        setDuplicateError("닉네임 중복 검사 응답이 올바르지 않습니다.");
        return false;
      } catch (e) {
        console.error("[useNicknameHandlers] duplicate check error:", e);
        setDuplicateError("닉네임 중복 검사에 실패했습니다.");
        return false;
      } finally {
        checkingRef.current = false;
        setIsChecking(false);
      }
    },
    [trigger, nicknamePath],
  );

  return {
    verifiedNickname,
    duplicateError,
    duplicateSuccess,
    isChecking,
    handleDuplicateCheck,
  };
}
