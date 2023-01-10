import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Crypto from 'crypto';

@Injectable()
export class AppService {
  public readonly healthCheckUrl: string;
  public readonly alertSecret: string;
  public readonly alertUrl: string;
  public readonly logger = new Logger('healthCheck');

  constructor(private readonly httpService: HttpService) {
    this.healthCheckUrl = process.env.HEALTH_CHECK_URL;
    this.alertUrl = process.env.ALERT_URL;
    this.alertSecret = process.env.ALERT_SECRET;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async healthCheck(): Promise<any> {
    try {
      const data = await this.httpService.get(this.healthCheckUrl);

      this.logger.log(`[${this.healthCheckUrl}] check successfully!`);

      return {
        data,
        time: new Date().toISOString(),
      };
    } catch {}
  }

  alert() {
    const timestamp = Date.now();
    const input = `${timestamp}\n${this.alertSecret}`;
    const sign = encodeURIComponent(
      Crypto.createHmac('sha256', this.alertSecret)
        .update(input)
        .digest('base64'),
    );

    const url = `${this.alertUrl}&timestamp=${timestamp}&sign=${sign}`;

    this.httpService.post(url, {
      at: {
        isAtAll: true,
      },
      text: {
        content: `${this.healthCheckUrl} 健康检查失败，请及时查看`,
      },
      msgtype: 'text',
    });
  }
}
