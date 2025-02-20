//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.28;


contract MockV3Aggregator {
    int256 public price ;

    constructor( int256 _initialAnswer) {
        
        price = _initialAnswer;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(0),
            price,
            block.timestamp,
            block.timestamp,
            uint80(0)
        );
    }

    function updateAnswer(int256 _price) external {
        price = _price;
    }
}