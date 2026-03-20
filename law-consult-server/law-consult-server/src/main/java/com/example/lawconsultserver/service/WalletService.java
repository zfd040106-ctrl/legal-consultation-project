package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.entity.WalletAccount;

import java.math.BigDecimal;

public interface WalletService {
    ApiResponse<?> getWalletSummary(String ownerType, Integer ownerId);

    ApiResponse<?> getWalletFlows(String ownerType, Integer ownerId, Integer page, Integer pageSize);

    ApiResponse<?> recharge(String ownerType, Integer ownerId, BigDecimal amount);

    ApiResponse<?> withdraw(String ownerType, Integer ownerId, BigDecimal amount);

    WalletAccount getOrCreateAccount(String ownerType, Integer ownerId);

    void escrowConsultation(Integer consultationId, Integer userId, BigDecimal amount);

    void settleConsultation(Integer consultationId, Integer userId, Integer lawyerId, BigDecimal amount);

    void refundConsultation(Integer consultationId, Integer userId, BigDecimal amount);
}
