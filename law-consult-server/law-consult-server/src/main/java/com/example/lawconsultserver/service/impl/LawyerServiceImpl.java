package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.entity.Consultation;
import com.example.lawconsultserver.entity.LawyerDocument;
import com.example.lawconsultserver.entity.LawyerInfo;
import com.example.lawconsultserver.entity.LawyerSearchItem;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.entity.WalletFlow;
import com.example.lawconsultserver.mapper.ConsultationMapper;
import com.example.lawconsultserver.mapper.LawyerDocumentMapper;
import com.example.lawconsultserver.mapper.LawyerInfoMapper;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.mapper.WalletFlowMapper;
import com.example.lawconsultserver.service.LawyerService;
import com.example.lawconsultserver.service.MediaAssetService;
import com.example.lawconsultserver.service.WalletService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LawyerServiceImpl implements LawyerService {

    private static final int DEFAULT_PAGE_SIZE = 10;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private LawyerInfoMapper lawyerInfoMapper;

    @Autowired
    private LawyerDocumentMapper lawyerDocumentMapper;

    @Autowired
    private ConsultationMapper consultationMapper;

    @Autowired
    private WalletService walletService;

    @Autowired
    private WalletFlowMapper walletFlowMapper;

    @Autowired
    private MediaAssetService mediaAssetService;

    @Override
    public ApiResponse<?> getLawyerProfile(Integer userId) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }

        User user = userMapper.selectUserById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }
        if (!"lawyer".equals(user.getRole())) {
            throw new BusinessException("该用户不是律师");
        }

        LawyerInfo lawyerInfo = lawyerInfoMapper.selectByUserId(userId);
        if (lawyerInfo == null) {
            throw new BusinessException("律师信息不存在");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("lawyerInfo", lawyerInfo);
        return ApiResponse.success(data);
    }

    @Override
    @Transactional
    public ApiResponse<?> updateLawyerProfile(Integer userId, String username, String avatar, String firmName,
                                              String specialization, Integer experienceYears) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }

        User user = userMapper.selectUserById(userId);
        if (user == null) {
            throw new BusinessException("用户不存在");
        }

        boolean userUpdated = false;
        if (StringUtils.isNotBlank(username)) {
            user.setUsername(username);
            userUpdated = true;
        }
        String normalizedAvatar = mediaAssetService.normalizeStoredAvatar(avatar);
        if (StringUtils.isNotBlank(normalizedAvatar)) {
            user.setAvatar(normalizedAvatar);
            userUpdated = true;
        }
        if (userUpdated && userMapper.updateUser(user) <= 0) {
            throw new BusinessException("更新用户信息失败");
        }

        LawyerInfo lawyerInfo = lawyerInfoMapper.selectByUserId(userId);
        if (lawyerInfo == null) {
            throw new BusinessException("律师信息不存在");
        }

        if (StringUtils.isNotBlank(firmName)) {
            lawyerInfo.setFirmName(firmName);
        }
        if (StringUtils.isNotBlank(specialization)) {
            lawyerInfo.setSpecialization(specialization);
        }
        if (experienceYears != null) {
            lawyerInfo.setExperienceYears(experienceYears);
        }
        if (lawyerInfoMapper.updateLawyerInfo(lawyerInfo) <= 0) {
            throw new BusinessException("更新律师信息失败");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("user", user);
        data.put("lawyerInfo", lawyerInfo);
        return ApiResponse.success("更新成功", data);
    }

    @Override
    @Transactional
    public ApiResponse<?> uploadDocument(Integer userId, String documentUrl, String documentType) {
        String normalizedDocumentUrl = mediaAssetService.normalizeStoredDocumentUrl(documentUrl);
        if (userId == null || StringUtils.isBlank(normalizedDocumentUrl) || StringUtils.isBlank(documentType)) {
            throw new BusinessException("参数不完整");
        }

        LawyerInfo lawyerInfo = lawyerInfoMapper.selectByUserId(userId);
        if (lawyerInfo == null) {
            throw new BusinessException("律师信息不存在");
        }

        LawyerDocument document = new LawyerDocument();
        document.setLawyerId(userId);
        document.setDocumentUrl(normalizedDocumentUrl);
        document.setDocumentType(documentType);

        if (lawyerDocumentMapper.insertDocument(document) <= 0) {
            throw new BusinessException("上传文件失败");
        }
        return ApiResponse.success("上传成功", null);
    }

    @Override
    public ApiResponse<?> getDocuments(Integer userId) {
        if (userId == null) {
            throw new BusinessException("用户ID不能为空");
        }
        return ApiResponse.success(lawyerDocumentMapper.selectByLawyerId(userId));
    }

    @Override
    @SuppressWarnings("unchecked")
    public ApiResponse<?> getLawyerStatistics(Integer lawyerId, String timeRange) {
        if (lawyerId == null) {
            throw new BusinessException("律师ID不能为空");
        }
        if (lawyerInfoMapper.selectByUserId(lawyerId) == null) {
            throw new BusinessException("律师信息不存在");
        }

        LocalDateTime[] range = resolveTimeRange(timeRange);
        LocalDateTime startTime = range[0];
        LocalDateTime endTime = range[1];

        List<Consultation> inProgressConsultations = consultationMapper.selectConsultationsByLawyerId(
                lawyerId,
                "in_progress",
                0L,
                10000
        );
        List<Consultation> resolvedConsultations = consultationMapper.selectConsultationsByLawyerId(
                lawyerId,
                "resolved",
                0L,
                10000
        );

        long inProgressCount = inProgressConsultations.stream()
                .filter(item -> isWithinRange(item.getUpdatedAt(), item.getCreatedAt(), startTime, endTime))
                .count();
        long resolvedCount = resolvedConsultations.stream()
                .filter(item -> isWithinRange(item.getResolvedAt(), item.getUpdatedAt(), item.getCreatedAt(), startTime, endTime))
                .count();
        Long totalCount = defaultLong(inProgressCount) + defaultLong(resolvedCount);

        Map<String, Object> overview = new HashMap<>();
        overview.put("totalConsultations", totalCount);
        overview.put("resolvedCount", defaultLong(resolvedCount));
        overview.put("inProgressCount", defaultLong(inProgressCount));

        List<Map<String, Object>> categoryList = new ArrayList<>();
        Map<String, Integer> categoryCounter = new HashMap<>();
        for (Consultation consultation : resolvedConsultations) {
            if (!isWithinRange(consultation.getResolvedAt(), consultation.getUpdatedAt(), consultation.getCreatedAt(), startTime, endTime)) {
                continue;
            }
            String categoryName = StringUtils.defaultIfBlank(consultation.getCategory(), "未分类");
            categoryCounter.put(categoryName, categoryCounter.getOrDefault(categoryName, 0) + 1);
        }
        for (Map.Entry<String, Integer> entry : categoryCounter.entrySet()) {
            Map<String, Object> category = new HashMap<>();
            category.put("name", entry.getKey());
            category.put("count", entry.getValue());
            categoryList.add(category);
        }
        categoryList.sort((left, right) -> Integer.compare(
                (Integer) right.get("count"),
                (Integer) left.get("count")
        ));

        Object walletData = walletService.getWalletSummary("lawyer", lawyerId).getData();
        Map<String, Object> wallet = walletData instanceof Map
                ? new HashMap<>((Map<String, Object>) walletData)
                : new HashMap<>();
        List<WalletFlow> allFlows = walletFlowMapper.selectByOwner("lawyer", lawyerId, 0L, 10000);
        List<WalletFlow> filteredFlows = new ArrayList<>();
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalWithdrawn = BigDecimal.ZERO;
        for (WalletFlow flow : allFlows) {
            if (!isWithinRange(flow.getCreatedAt(), null, startTime, endTime)) {
                continue;
            }
            filteredFlows.add(flow);
            if (!"success".equals(flow.getStatus())) {
                continue;
            }
            if ("in".equals(flow.getDirection())) {
                totalIncome = totalIncome.add(defaultAmount(flow.getAmount()));
            } else if ("out".equals(flow.getDirection())) {
                totalWithdrawn = totalWithdrawn.add(defaultAmount(flow.getAmount()));
            }
        }
        wallet.put("totalIncome", totalIncome);
        wallet.put("totalWithdrawn", totalWithdrawn);

        List<WalletFlow> recentFlows = filteredFlows.size() > 5
                ? filteredFlows.subList(0, 5)
                : filteredFlows;

        Map<String, Object> stats = new HashMap<>();
        stats.put("overview", overview);
        stats.put("categories", categoryList);
        stats.put("wallet", wallet);
        stats.put("recentFlows", recentFlows);
        return ApiResponse.success(stats);
    }

    @Override
    public ApiResponse<?> getLawyerIndexStats(Integer lawyerId) {
        if (lawyerId == null) {
            throw new BusinessException("律师ID不能为空");
        }
        if (lawyerInfoMapper.selectByUserId(lawyerId) == null) {
            throw new BusinessException("律师信息不存在");
        }

        Map<String, Object> data = new HashMap<>();
        long openCount = defaultLong(consultationMapper.countLawyerConsultations(lawyerId, "open"));
        long pendingAcceptCount = defaultLong(consultationMapper.countLawyerConsultations(lawyerId, "pending_accept"));
        data.put("pendingCount", openCount + pendingAcceptCount);
        data.put("inProgressCount", defaultLong(consultationMapper.countLawyerConsultations(lawyerId, "in_progress")));
        data.put("resolvedCount", defaultLong(consultationMapper.countLawyerConsultations(lawyerId, "resolved")));
        data.put("wallet", walletService.getWalletSummary("lawyer", lawyerId).getData());
        return ApiResponse.success(data);
    }

    @Override
    public ApiResponse<?> searchLawyers(String keyword, Integer page, Integer pageSize) {
        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;
        long offset = (long) (page - 1) * pageSize;

        List<LawyerSearchItem> items = lawyerInfoMapper.searchActiveLawyers(keyword, offset, pageSize);
        Long total = lawyerInfoMapper.countActiveLawyers(keyword);
        return ApiResponse.success(PageResponse.of(total, page, pageSize, items));
    }

    @Override
    public ApiResponse<?> getLawyerPublicProfile(Integer lawyerId) {
        if (lawyerId == null) {
            throw new BusinessException("律师ID不能为空");
        }
        LawyerSearchItem item = lawyerInfoMapper.selectSearchItemByUserId(lawyerId);
        if (item == null) {
            throw new BusinessException("律师不存在或未通过审核");
        }
        return ApiResponse.success(item);
    }

    private long defaultLong(Long value) {
        return value == null ? 0L : value;
    }

    private BigDecimal defaultAmount(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private boolean isWithinRange(LocalDateTime primaryTime,
                                  LocalDateTime fallbackTime,
                                  LocalDateTime startTime,
                                  LocalDateTime endTime) {
        LocalDateTime target = primaryTime != null ? primaryTime : fallbackTime;
        if (target == null) {
            return startTime == null || endTime == null;
        }
        if (startTime == null || endTime == null) {
            return true;
        }
        return !target.isBefore(startTime) && target.isBefore(endTime);
    }

    private boolean isWithinRange(LocalDateTime primaryTime,
                                  LocalDateTime secondaryTime,
                                  LocalDateTime fallbackTime,
                                  LocalDateTime startTime,
                                  LocalDateTime endTime) {
        LocalDateTime target = primaryTime != null
                ? primaryTime
                : (secondaryTime != null ? secondaryTime : fallbackTime);
        if (target == null) {
            return startTime == null || endTime == null;
        }
        if (startTime == null || endTime == null) {
            return true;
        }
        return !target.isBefore(startTime) && target.isBefore(endTime);
    }

    private LocalDateTime[] resolveTimeRange(String timeRange) {
        String normalizedRange = StringUtils.defaultIfBlank(timeRange, "week");
        LocalDateTime now = LocalDateTime.now();

        switch (normalizedRange) {
            case "week":
                return new LocalDateTime[]{
                        LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay(),
                        now
                };
            case "month":
                return new LocalDateTime[]{
                        LocalDate.now().withDayOfMonth(1).atStartOfDay(),
                        now
                };
            case "all":
            default:
                return new LocalDateTime[]{null, null};
        }
    }
}
