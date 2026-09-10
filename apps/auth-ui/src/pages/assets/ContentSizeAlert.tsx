import { MAX_ENCODED_BYTES, estimateEncodedSize, isOverSizeLimit } from '../../lib/asset-content';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

/** Warn before the api does, so a large asset fails here with an explanation rather than as an opaque server error. */
const WARNING_BYTES = MAX_ENCODED_BYTES * 0.9;

const asKilobytes = (bytes: number): string => `${Math.round(bytes / 1024)} KB`;

/** Nothing at all for ordinary content, a warning as it nears the api's body limit, a refusal above it. */
export const ContentSizeAlert = ({ content }: { content: string }) => {
  const encodedSize = estimateEncodedSize(content);

  if (isOverSizeLimit(content)) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Too large to save</AlertTitle>
        <AlertDescription>
          This content encodes to {asKilobytes(encodedSize)}, over the api&apos;s {asKilobytes(MAX_ENCODED_BYTES)} request limit. Shorten it before
          saving.
        </AlertDescription>
      </Alert>
    );
  }

  if (encodedSize <= WARNING_BYTES) return null;

  return (
    <Alert>
      <AlertTitle>Approaching the request size limit</AlertTitle>
      <AlertDescription>
        This content encodes to {asKilobytes(encodedSize)} of the api&apos;s {asKilobytes(MAX_ENCODED_BYTES)} request limit.
      </AlertDescription>
    </Alert>
  );
};
