import { AwsRum } from 'aws-rum-web';
import type { AwsRumConfig } from 'aws-rum-web';

let awsRum: AwsRum | undefined;

export function initRum() {
  if (import.meta.env.DEV) return;
  if (awsRum) return;

  try {
    const APPLICATION_ID = 'd44bb5ed-7103-445b-9e64-0103a5ee2a3a';
    const APPLICATION_VERSION = '1.0.0';
    const APPLICATION_REGION = 'us-east-1';

    const config: AwsRumConfig = {
      allowCookies: true,
      endpoint: 'https://dataplane.rum.us-east-1.amazonaws.com',
      sessionSampleRate: 1,
      telemetries: ['errors', 'performance', 'http'],
      signing: false,
    };

    awsRum = new AwsRum(
      APPLICATION_ID,
      APPLICATION_VERSION,
      APPLICATION_REGION,
      config
    );
  } catch (error) {
    console.error('CloudWatch RUM init failed:', error);
  }
}