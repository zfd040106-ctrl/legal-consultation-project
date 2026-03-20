package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.WalletActionRequest;
import com.example.lawconsultserver.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 閽卞寘鎺ュ彛
 */
@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @GetMapping("/user/{userId}")
    public ApiResponse<?> getUserSummary(@PathVariable Integer userId) {
        return walletService.getWalletSummary("user", userId);
    }

    @GetMapping("/user/{userId}/flows")
    public ApiResponse<?> getUserFlows(@PathVariable Integer userId,
                                       @RequestParam(defaultValue = "1") Integer page,
                                       @RequestParam(defaultValue = "20") Integer pageSize) {
        return walletService.getWalletFlows("user", userId, page, pageSize);
    }

    @PostMapping("/user/{userId}/recharge")
    public ApiResponse<?> userRecharge(@PathVariable Integer userId,
                                       @RequestBody WalletActionRequest request) {
        return walletService.recharge("user", userId, request.getAmount());
    }

    @PostMapping("/user/{userId}/withdraw")
    public ApiResponse<?> userWithdraw(@PathVariable Integer userId,
                                       @RequestBody WalletActionRequest request) {
        return walletService.withdraw("user", userId, request.getAmount());
    }

    @GetMapping("/lawyer/{lawyerId}")
    public ApiResponse<?> getLawyerSummary(@PathVariable Integer lawyerId) {
        return walletService.getWalletSummary("lawyer", lawyerId);
    }

    @GetMapping("/lawyer/{lawyerId}/flows")
    public ApiResponse<?> getLawyerFlows(@PathVariable Integer lawyerId,
                                         @RequestParam(defaultValue = "1") Integer page,
                                         @RequestParam(defaultValue = "20") Integer pageSize) {
        return walletService.getWalletFlows("lawyer", lawyerId, page, pageSize);
    }

    @PostMapping("/lawyer/{lawyerId}/withdraw")
    public ApiResponse<?> lawyerWithdraw(@PathVariable Integer lawyerId,
                                         @RequestBody WalletActionRequest request) {
        return walletService.withdraw("lawyer", lawyerId, request.getAmount());
    }
}
