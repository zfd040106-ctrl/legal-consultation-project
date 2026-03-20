package com.example.lawconsultserver.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 閽卞寘璐︽埛
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletAccount {
    private Integer id;
    private String ownerType;
    private Integer ownerId;
    private BigDecimal availableBalance;
    private BigDecimal frozenBalance;
    private BigDecimal totalIncome;
    private BigDecimal totalWithdrawn;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
