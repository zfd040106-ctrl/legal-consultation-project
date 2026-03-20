package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.WalletAccount;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface WalletAccountMapper {
    WalletAccount selectByOwner(@Param("ownerType") String ownerType, @Param("ownerId") Integer ownerId);

    int insertAccount(WalletAccount walletAccount);

    int updateAccount(WalletAccount walletAccount);
}
