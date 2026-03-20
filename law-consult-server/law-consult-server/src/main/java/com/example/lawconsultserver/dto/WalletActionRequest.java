package com.example.lawconsultserver.dto;

import java.math.BigDecimal;

/**
 * 閽卞寘鍔ㄤ綔璇锋眰
 */
public class WalletActionRequest {
    private String ownerType;
    private Integer ownerId;
    private BigDecimal amount;

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
