import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AdminDashboardUsersDto {
  @ApiProperty({ example: 125 })
  total!: number;

  @ApiProperty({ example: 118 })
  active!: number;

  @ApiProperty({ example: 7 })
  inactive!: number;
}

class AdminDashboardTenantsDto {
  @ApiProperty({ example: 32 })
  total!: number;

  @ApiProperty({ example: 28 })
  active!: number;

  @ApiProperty({ example: 2 })
  suspended!: number;

  @ApiProperty({ example: 2 })
  cancelled!: number;
}

class AdminDashboardSubscriptionsDto {
  @ApiProperty({ example: 32 })
  total!: number;

  @ApiProperty({ example: 1 })
  pending!: number;

  @ApiProperty({ example: 4 })
  trialing!: number;

  @ApiProperty({ example: 23 })
  active!: number;

  @ApiProperty({ example: 2 })
  pastDue!: number;

  @ApiProperty({ example: 1 })
  suspended!: number;

  @ApiProperty({ example: 1 })
  cancelled!: number;

  @ApiProperty({ example: 0 })
  expired!: number;
}

class AdminDashboardBillingMetricDto {
  @ApiProperty({ example: 18 })
  count!: number;

  @ApiProperty({ example: 14990.5 })
  amount!: number;
}

class AdminDashboardBillingDto {
  @ApiProperty({
    type: AdminDashboardBillingMetricDto,
  })
  paid!: AdminDashboardBillingMetricDto;

  @ApiProperty({
    type: AdminDashboardBillingMetricDto,
  })
  pending!: AdminDashboardBillingMetricDto;

  @ApiProperty({
    type: AdminDashboardBillingMetricDto,
  })
  overdue!: AdminDashboardBillingMetricDto;
}

export class AdminDashboardSummaryDto {
  @ApiPropertyOptional({
    type: AdminDashboardUsersDto,
  })
  users?: AdminDashboardUsersDto;

  @ApiPropertyOptional({
    type: AdminDashboardTenantsDto,
  })
  tenants?: AdminDashboardTenantsDto;

  @ApiPropertyOptional({
    type: AdminDashboardSubscriptionsDto,
  })
  subscriptions?: AdminDashboardSubscriptionsDto;

  @ApiPropertyOptional({
    type: AdminDashboardBillingDto,
  })
  billing?: AdminDashboardBillingDto;
}
