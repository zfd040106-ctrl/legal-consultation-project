package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.WalletFlow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface WalletFlowMapper {
    int insertFlow(WalletFlow walletFlow);

    List<WalletFlow> selectByOwner(@Param("ownerType") String ownerType,
                                   @Param("ownerId") Integer ownerId,
                                   @Param("offset") Long offset,
                                   @Param("limit") Integer limit);

    Long countByOwner(@Param("ownerType") String ownerType, @Param("ownerId") Integer ownerId);

    BigDecimal sumAmountByDirection(@Param("ownerType") String ownerType,
                                    @Param("ownerId") Integer ownerId,
                                    @Param("direction") String direction);
}
