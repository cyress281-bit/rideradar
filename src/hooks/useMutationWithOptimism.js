import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

export function useMutationWithOptimism(mutationFn, options = {}) {
  const { toast } = useToast();

  return useMutation({
    mutationFn,
    onMutate: options.onMutate,
    onError: (err, variables, context) => {
      if (options.onError) {
        options.onError(err, variables, context);
      }
      if (options.errorMessage) {
        toast({ title: options.errorMessage, variant: "destructive" });
      }
    },
    onSuccess: (data, variables, context) => {
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
      if (options.successMessage) {
        toast({ title: options.successMessage });
      }
    },
  });
}