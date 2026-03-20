package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 閽卞寘娴佹按
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletFlow {
    private Integer id;
    private String ownerType;
    private Integer ownerId;
    private String bizType;
    private Integer bizId;
    private String direction;
    private BigDecimal amount;
    private String status;
    private BigDecimal balanceAfter;
    private String remark;
    private Integer operatorId;
    private LocalDateTime createdAt;
}
