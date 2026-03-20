package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.entity.WalletAccount;
import com.example.lawconsultserver.entity.WalletFlow;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.mapper.WalletAccountMapper;
import com.example.lawconsultserver.mapper.WalletFlowMapper;
import com.example.lawconsultserver.service.WalletService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class WalletServiceImpl implements WalletService {

    private static final BigDecimal ZERO_AMOUNT = new BigDecimal("0.00");
    private static final int DEFAULT_PAGE_SIZE = 20;

    @Autowired
    private WalletAccountMapper walletAccountMapper;

    @Autowired
    private WalletFlowMapper walletFlowMapper;

    @Autowired
    private UserMapper userMapper;

    @Override
    public ApiResponse<?> getWalletSummary(String ownerType, Integer ownerId) {
        WalletAccount account = getOrCreateAccount(ownerType, ownerId);
        BigDecimal totalExpense = defaultAmount(walletFlowMapper.sumAmountByDirection(ownerType, ownerId, "out"));

        Map<String, Object> data = new HashMap<>();
        data.put("account", account);
        data.put("availableBalance", defaultAmount(account.getAvailableBalance()));
        data.put("frozenBalance", defaultAmount(account.getFrozenBalance()));
        data.put("totalIncome", defaultAmount(account.getTotalIncome()));
        data.put("totalWithdrawn", defaultAmount(account.getTotalWithdrawn()));
        data.put("totalExpense", totalExpense);
        return ApiResponse.success(data);
    }

    @Override
    public ApiResponse<?> getWalletFlows(String ownerType, Integer ownerId, Integer page, Integer pageSize) {
        validateOwner(ownerType, ownerId);
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        List<WalletFlow> items = walletFlowMapper.selectByOwner(ownerType, ownerId, offset, pageSize);
        Long total = walletFlowMapper.countByOwner(ownerType, ownerId);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, items));
    }

    @Override
    @Transactional
    public ApiResponse<?> recharge(String ownerType, Integer ownerId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        WalletAccount account = getOrCreateAccount(ownerType, ownerId);

        account.setAvailableBalance(defaultAmount(account.getAvailableBalance()).add(normalizedAmount));
        account.setTotalIncome(defaultAmount(account.getTotalIncome()).add(normalizedAmount));
        updateAccount(account);

        insertFlow(ownerType, ownerId, "recharge", null, "in", normalizedAmount,
                account.getAvailableBalance(), "钱包充值", ownerId);
        return ApiResponse.success("充值成功", buildWalletSnapshot(account, ownerType, ownerId));
    }

    @Override
    @Transactional
    public ApiResponse<?> withdraw(String ownerType, Integer ownerId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        WalletAccount account = getOrCreateAccount(ownerType, ownerId);
        if (defaultAmount(account.getAvailableBalance()).compareTo(normalizedAmount) < 0) {
            throw new BusinessException("可用余额不足");
        }

        account.setAvailableBalance(defaultAmount(account.getAvailableBalance()).subtract(normalizedAmount));
        account.setTotalWithdrawn(defaultAmount(account.getTotalWithdrawn()).add(normalizedAmount));
        updateAccount(account);

        insertFlow(ownerType, ownerId, "withdraw_success", null, "out", normalizedAmount,
                account.getAvailableBalance(), "余额提现", ownerId);
        return ApiResponse.success("提现申请成功", buildWalletSnapshot(account, ownerType, ownerId));
    }

    @Override
    @Transactional
    public WalletAccount getOrCreateAccount(String ownerType, Integer ownerId) {
        validateOwner(ownerType, ownerId);
        WalletAccount account = walletAccountMapper.selectByOwner(ownerType, ownerId);
        if (account != null) {
            return account;
        }

        WalletAccount newAccount = WalletAccount.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .availableBalance(ZERO_AMOUNT)
                .frozenBalance(ZERO_AMOUNT)
                .totalIncome(ZERO_AMOUNT)
                .totalWithdrawn(ZERO_AMOUNT)
                .version(0)
                .build();
        int result = walletAccountMapper.insertAccount(newAccount);
        if (result <= 0) {
            throw new BusinessException("创建钱包账户失败");
        }
        return walletAccountMapper.selectByOwner(ownerType, ownerId);
    }

    @Override
    @Transactional
    public void escrowConsultation(Integer consultationId, Integer userId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        WalletAccount userAccount = getOrCreateAccount("user", userId);
        if (defaultAmount(userAccount.getAvailableBalance()).compareTo(normalizedAmount) < 0) {
            throw new BusinessException("钱包余额不足，请先充值");
        }

        userAccount.setAvailableBalance(defaultAmount(userAccount.getAvailableBalance()).subtract(normalizedAmount));
        userAccount.setFrozenBalance(defaultAmount(userAccount.getFrozenBalance()).add(normalizedAmount));
        updateAccount(userAccount);

        insertFlow("user", userId, "consult_pay", consultationId, "out", normalizedAmount,
                userAccount.getAvailableBalance(), "咨询费用托管", userId);
    }

    @Override
    @Transactional
    public void settleConsultation(Integer consultationId, Integer userId, Integer lawyerId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        WalletAccount userAccount = getOrCreateAccount("user", userId);
        if (defaultAmount(userAccount.getFrozenBalance()).compareTo(normalizedAmount) < 0) {
            throw new BusinessException("用户冻结金额不足，无法结算");
        }

        userAccount.setFrozenBalance(defaultAmount(userAccount.getFrozenBalance()).subtract(normalizedAmount));
        updateAccount(userAccount);

        WalletAccount lawyerAccount = getOrCreateAccount("lawyer", lawyerId);
        lawyerAccount.setAvailableBalance(defaultAmount(lawyerAccount.getAvailableBalance()).add(normalizedAmount));
        lawyerAccount.setTotalIncome(defaultAmount(lawyerAccount.getTotalIncome()).add(normalizedAmount));
        updateAccount(lawyerAccount);

        insertFlow("lawyer", lawyerId, "consult_settle", consultationId, "in", normalizedAmount,
                lawyerAccount.getAvailableBalance(), "咨询服务结算", lawyerId);
    }

    @Override
    @Transactional
    public void refundConsultation(Integer consultationId, Integer userId, BigDecimal amount) {
        BigDecimal normalizedAmount = normalizePositiveAmount(amount);
        WalletAccount userAccount = getOrCreateAccount("user", userId);
        if (defaultAmount(userAccount.getFrozenBalance()).compareTo(normalizedAmount) < 0) {
            throw new BusinessException("冻结金额不足，无法退款");
        }

        userAccount.setFrozenBalance(defaultAmount(userAccount.getFrozenBalance()).subtract(normalizedAmount));
        userAccount.setAvailableBalance(defaultAmount(userAccount.getAvailableBalance()).add(normalizedAmount));
        updateAccount(userAccount);

        insertFlow("user", userId, "consult_refund", consultationId, "in", normalizedAmount,
                userAccount.getAvailableBalance(), "咨询费用退款", userId);
    }

    private void validateOwner(String ownerType, Integer ownerId) {
        if (ownerId == null || StringUtils.isBlank(ownerType)) {
            throw new BusinessException("钱包参数不完整");
        }
        if (!"user".equals(ownerType) && !"lawyer".equals(ownerType)) {
            throw new BusinessException("钱包账户类型无效");
        }

        User owner = userMapper.selectUserById(ownerId);
        if (owner == null) {
            throw new BusinessException("钱包账户所属用户不存在");
        }
        if (!ownerType.equals(owner.getRole())) {
            throw new BusinessException("钱包账户类型与用户角色不匹配");
        }
    }

    private BigDecimal normalizePositiveAmount(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("金额必须大于 0");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal defaultAmount(BigDecimal amount) {
        return amount == null ? ZERO_AMOUNT : amount.setScale(2, RoundingMode.HALF_UP);
    }

    private void updateAccount(WalletAccount account) {
        int result = walletAccountMapper.updateAccount(account);
        if (result <= 0) {
            throw new BusinessException("更新钱包账户失败");
        }
    }

    private void insertFlow(String ownerType, Integer ownerId, String bizType, Integer bizId, String direction,
                            BigDecimal amount, BigDecimal balanceAfter, String remark, Integer operatorId) {
        WalletFlow flow = WalletFlow.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .bizType(bizType)
                .bizId(bizId)
                .direction(direction)
                .amount(amount)
                .status("success")
                .balanceAfter(defaultAmount(balanceAfter))
                .remark(remark)
                .operatorId(operatorId)
                .build();
        int result = walletFlowMapper.insertFlow(flow);
        if (result <= 0) {
            throw new BusinessException("记录钱包流水失败");
        }
    }

    private Map<String, Object> buildWalletSnapshot(WalletAccount account, String ownerType, Integer ownerId) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("account", account);
        snapshot.put("availableBalance", defaultAmount(account.getAvailableBalance()));
        snapshot.put("frozenBalance", defaultAmount(account.getFrozenBalance()));
        snapshot.put("totalIncome", defaultAmount(account.getTotalIncome()));
        snapshot.put("totalWithdrawn", defaultAmount(account.getTotalWithdrawn()));
        snapshot.put("totalExpense", defaultAmount(walletFlowMapper.sumAmountByDirection(ownerType, ownerId, "out")));
        return snapshot;
    }
}
